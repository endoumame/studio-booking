import type { ExtensionStatusType, RequestId } from "@my-app/shared";
import { err, ok } from "neverthrow";
import { invalidState, validation } from "../shared/errors.js";
import type { DomainError } from "../shared/errors.js";
import { ExtensionStatus } from "@my-app/shared";
import type { Result } from "neverthrow";

const MIN_EXTRA_MINUTES = 1;

interface ExtensionRequest {
  readonly requestId: RequestId;
  readonly extraMinutes: number;
  readonly status: ExtensionStatusType;
  readonly requestedAt: Date;
}

interface CreateExtensionRequestProps {
  readonly requestId: RequestId;
  readonly extraMinutes: number;
  readonly requestedAt: Date;
}

const createExtensionRequest = (
  props: CreateExtensionRequestProps,
): Result<ExtensionRequest, DomainError> => {
  if (!Number.isInteger(props.extraMinutes) || props.extraMinutes < MIN_EXTRA_MINUTES) {
    return err(validation("Extra minutes must be a positive integer"));
  }
  return ok({
    extraMinutes: props.extraMinutes,
    requestId: props.requestId,
    requestedAt: props.requestedAt,
    status: ExtensionStatus.PENDING,
  });
};

const approveExtension = (ext: ExtensionRequest): Result<ExtensionRequest, DomainError> => {
  if (ext.status !== ExtensionStatus.PENDING) {
    return err(invalidState("Extension must be pending to approve"));
  }
  return ok({ ...ext, status: ExtensionStatus.APPROVED });
};

const rejectExtension = (ext: ExtensionRequest): Result<ExtensionRequest, DomainError> => {
  if (ext.status !== ExtensionStatus.PENDING) {
    return err(invalidState("Extension must be pending to reject"));
  }
  return ok({ ...ext, status: ExtensionStatus.REJECTED });
};

export { approveExtension, createExtensionRequest, rejectExtension };
export type { CreateExtensionRequestProps, ExtensionRequest };
