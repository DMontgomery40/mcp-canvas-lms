import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { CanvasClient } from "../src/client.js";
import { CanvasAPIError } from "../src/types.js";

vi.mock("axios", () => {
  const mockedAxios = {
    create: vi.fn(),
    get: vi.fn(),
  };

  return {
    default: mockedAxios,
  };
});

const authHeaders = {
  Authorization: "Bearer test-token",
  "Content-Type": "application/json",
};

type ResponseHandler = (response: any) => Promise<any>;

function linkHeader(nextUrl: string): string {
  return `<${nextUrl}>; rel="next"`;
}

function paginatedResponse(
  data: any[],
  nextUrl?: string,
  paginationLimit?: number,
): any {
  return {
    data,
    headers: {
      "content-type": "application/json",
      ...(nextUrl ? { link: linkHeader(nextUrl) } : {}),
    },
    config: {
      headers: authHeaders,
      timeout: 30000,
      ...(paginationLimit !== undefined ? { paginationLimit } : {}),
    },
  };
}

function canvasApiAxiosError(status: number, data: any): any {
  return {
    message: `Request failed with status code ${status}`,
    response: {
      status,
      data,
      headers: {
        "content-type": "application/json",
      },
    },
  };
}

describe("CanvasClient pagination", () => {
  let client: CanvasClient;
  let responseHandler: ResponseHandler;
  let mockInstance: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> };
      response: { use: ReturnType<typeof vi.fn> };
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: {
          use: vi.fn((onFulfilled: ResponseHandler) => {
            responseHandler = onFulfilled;
          }),
        },
      },
    };

    vi.mocked(axios.create).mockReturnValue(mockInstance as any);
    vi.mocked(axios.get).mockReset();
    client = new CanvasClient("test-token", "canvas.example.edu", {
      retryDelay: 0,
    });
  });

  it("passes listCourses limit into both Canvas per_page and the paginator cap", async () => {
    mockInstance.get.mockResolvedValue({ data: [] });

    await client.listCourses({ limit: 5, enrollmentState: "active" });

    expect(mockInstance.get).toHaveBeenCalledWith("/courses", {
      params: {
        include: ["total_students", "teachers", "term", "course_progress"],
        state: ["available", "completed"],
        enrollment_state: "active",
        per_page: 5,
      },
      paginationLimit: 5,
    });
  });

  it("does not fetch a next page when the first page already satisfies the limit", async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
    }));

    const result = await responseHandler(
      paginatedResponse(
        firstPage,
        "https://canvas.example.edu/api/v1/courses?page=2",
        5,
      ),
    );

    expect(axios.get).not.toHaveBeenCalled();
    expect(result.data).toEqual(firstPage.slice(0, 5));
  });

  it("stops pagination as soon as a cross-page limit is satisfied", async () => {
    const page2Url = "https://canvas.example.edu/api/v1/courses?page=2";
    const page3Url = "https://canvas.example.edu/api/v1/courses?page=3";
    vi.mocked(axios.get).mockResolvedValueOnce(
      paginatedResponse([{ id: 3 }, { id: 4 }], page3Url, 3),
    );

    const result = await responseHandler(
      paginatedResponse([{ id: 1 }, { id: 2 }], page2Url, 3),
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(page2Url, {
      headers: authHeaders,
      timeout: 30000,
    });
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it("continues through every linked page when no limit is set", async () => {
    const page2Url = "https://canvas.example.edu/api/v1/courses?page=2";
    const page3Url = "https://canvas.example.edu/api/v1/courses?page=3";
    vi.mocked(axios.get)
      .mockResolvedValueOnce(paginatedResponse([{ id: 2 }], page3Url))
      .mockResolvedValueOnce(paginatedResponse([{ id: 3 }]));

    const result = await responseHandler(
      paginatedResponse([{ id: 1 }], page2Url),
    );

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it("wraps non-retryable paginated page failures as CanvasAPIError", async () => {
    const page2Url = "https://canvas.example.edu/api/v1/courses?page=2";
    vi.mocked(axios.get).mockRejectedValueOnce(
      canvasApiAxiosError(401, { message: "Unauthorized" }),
    );

    let error: unknown;
    try {
      await responseHandler(paginatedResponse([{ id: 1 }], page2Url));
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(CanvasAPIError);
    expect(error).toMatchObject({
      message: "Canvas API Error (401): Unauthorized",
      statusCode: 401,
      response: { message: "Unauthorized" },
    });
  });

  it("retries transient paginated page failures before returning data", async () => {
    const page2Url = "https://canvas.example.edu/api/v1/courses?page=2";
    vi.mocked(axios.get)
      .mockRejectedValueOnce(
        canvasApiAxiosError(500, { message: "Server error" }),
      )
      .mockResolvedValueOnce(paginatedResponse([{ id: 2 }]));

    const result = await responseHandler(
      paginatedResponse([{ id: 1 }], page2Url),
    );

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(1, page2Url, {
      headers: authHeaders,
      timeout: 30000,
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, page2Url, {
      headers: authHeaders,
      timeout: 30000,
    });
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
