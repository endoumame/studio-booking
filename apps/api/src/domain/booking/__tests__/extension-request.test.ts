import { ExtensionRequest } from "../extension-request.js";
import { ExtensionStatus } from "@my-app/shared";
import type { RequestId } from "@my-app/shared";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const REQUEST_ID = "REQ-001" as RequestId;
const EXTRA_MINUTES_30 = 30;
const EXTRA_MINUTES_60 = 60;
const ZERO_MINUTES = 0;
const NEGATIVE_MINUTES = -5;
const REQUESTED_AT = new Date("2026-05-10T15:00:00");

const createPendingRequest = (): ExtensionRequest =>
  ExtensionRequest.create(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT);

describe("ExtensionRequest creation", () => {
  it("should create with PENDING status", () => {
    const request = ExtensionRequest.create(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT);
    expect(request.requestId).toBe(REQUEST_ID);
    expect(request.extraMinutes).toBe(EXTRA_MINUTES_30);
    expect(request.status).toBe(ExtensionStatus.PENDING);
    expect(request.requestedAt).toEqual(REQUESTED_AT);
  });

  it("should create with different extra minutes", () => {
    const request = ExtensionRequest.create(REQUEST_ID, EXTRA_MINUTES_60, REQUESTED_AT);
    expect(request.extraMinutes).toBe(EXTRA_MINUTES_60);
  });

  it("should reject zero minutes", () => {
    expect(() => ExtensionRequest.create(REQUEST_ID, ZERO_MINUTES, REQUESTED_AT)).toThrow(
      RangeError,
    );
  });

  it("should reject negative minutes", () => {
    expect(() => ExtensionRequest.create(REQUEST_ID, NEGATIVE_MINUTES, REQUESTED_AT)).toThrow(
      RangeError,
    );
  });
});

describe("ExtensionRequest isPending", () => {
  it("should return true for pending request", () => {
    const request = createPendingRequest();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(request.isPending()).toBe(true);
  });

  it("should return false for approved request", () => {
    const request = createPendingRequest().approve();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(request.isPending()).toBe(false);
  });

  it("should return false for rejected request", () => {
    const request = createPendingRequest().reject();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(request.isPending()).toBe(false);
  });
});

describe("ExtensionRequest approve", () => {
  it("should transition to APPROVED status", () => {
    const approved = createPendingRequest().approve();
    expect(approved.status).toBe(ExtensionStatus.APPROVED);
    expect(approved.extraMinutes).toBe(EXTRA_MINUTES_30);
    expect(approved.requestId).toBe(REQUEST_ID);
  });

  it("should not allow approving already approved request", () => {
    const approved = createPendingRequest().approve();
    expect(() => approved.approve()).toThrow("Can only approve pending extension requests");
  });

  it("should not allow approving rejected request", () => {
    const rejected = createPendingRequest().reject();
    expect(() => rejected.approve()).toThrow("Can only approve pending extension requests");
  });
});

describe("ExtensionRequest reject", () => {
  it("should transition to REJECTED status", () => {
    const rejected = createPendingRequest().reject();
    expect(rejected.status).toBe(ExtensionStatus.REJECTED);
    expect(rejected.requestId).toBe(REQUEST_ID);
  });

  it("should not allow rejecting already rejected request", () => {
    const rejected = createPendingRequest().reject();
    expect(() => rejected.reject()).toThrow("Can only reject pending extension requests");
  });

  it("should not allow rejecting approved request", () => {
    const approved = createPendingRequest().approve();
    expect(() => approved.reject()).toThrow("Can only reject pending extension requests");
  });
});

describe("ExtensionRequest isApproved", () => {
  it("should return true for approved request", () => {
    const approved = createPendingRequest().approve();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(approved.isApproved()).toBe(true);
  });

  it("should return false for pending request", () => {
    const request = createPendingRequest();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(request.isApproved()).toBe(false);
  });

  it("should return false for rejected request", () => {
    const rejected = createPendingRequest().reject();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(rejected.isApproved()).toBe(false);
  });
});
