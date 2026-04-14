import { ExtensionStatus } from "@my-app/shared";
import type { RequestId } from "@my-app/shared";

const MIN_MINUTES = 1;

interface ExtensionRequestProps {
  requestId: RequestId;
  extraMinutes: number;
  status: ExtensionStatus;
  requestedAt: Date;
}

class ExtensionRequest {
  readonly requestId: RequestId;
  readonly extraMinutes: number;
  readonly status: ExtensionStatus;
  readonly requestedAt: Date;

  private constructor(props: ExtensionRequestProps) {
    this.requestId = props.requestId;
    this.extraMinutes = props.extraMinutes;
    this.status = props.status;
    this.requestedAt = props.requestedAt;
  }

  static create(requestId: RequestId, extraMinutes: number, requestedAt: Date): ExtensionRequest {
    if (extraMinutes < MIN_MINUTES) {
      throw new RangeError("Extension must be at least 1 minute");
    }
    return new ExtensionRequest({
      extraMinutes,
      requestId,
      requestedAt,
      status: ExtensionStatus.PENDING,
    });
  }

  approve(): ExtensionRequest {
    if (this.status !== ExtensionStatus.PENDING) {
      throw new Error("Can only approve pending extension requests");
    }
    return new ExtensionRequest({ ...this.toProps(), status: ExtensionStatus.APPROVED });
  }

  reject(): ExtensionRequest {
    if (this.status !== ExtensionStatus.PENDING) {
      throw new Error("Can only reject pending extension requests");
    }
    return new ExtensionRequest({ ...this.toProps(), status: ExtensionStatus.REJECTED });
  }

  isPending(): boolean {
    return this.status === ExtensionStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === ExtensionStatus.APPROVED;
  }

  private toProps(): ExtensionRequestProps {
    return {
      extraMinutes: this.extraMinutes,
      requestId: this.requestId,
      requestedAt: this.requestedAt,
      status: this.status,
    };
  }
}

export { ExtensionRequest };
