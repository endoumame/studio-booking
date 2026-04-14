import { err, ok } from "neverthrow";
import type { Address } from "../shared/address.js";
import type { CancellationPolicy } from "./cancellation-policy.js";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";
import type { Room } from "./room.js";
import type { StudioId } from "@my-app/shared";
import { validation } from "../shared/errors.js";

const MIN_NAME_LENGTH = 0;
const MIN_ROOMS_LENGTH = 0;

interface Studio {
  readonly studioId: StudioId;
  readonly name: string;
  readonly address: Address;
  readonly rooms: readonly Room[];
  readonly cancellationPolicy: CancellationPolicy;
}

interface CreateStudioProps {
  readonly studioId: StudioId;
  readonly name: string;
  readonly address: Address;
  readonly rooms: readonly Room[];
  readonly cancellationPolicy: CancellationPolicy;
}

const validateStudioName = (name: string): Result<string, DomainError> => {
  if (name.trim().length === MIN_NAME_LENGTH) {
    return err(validation("Studio name must not be empty"));
  }
  return ok(name.trim());
};

const validateStudioRooms = (rooms: readonly Room[]): Result<readonly Room[], DomainError> => {
  if (rooms.length === MIN_ROOMS_LENGTH) {
    return err(validation("Studio must have at least one room"));
  }
  return ok([...rooms]);
};

const createStudio = (props: CreateStudioProps): Result<Studio, DomainError> =>
  validateStudioName(props.name).andThen((name) =>
    validateStudioRooms(props.rooms).map((rooms) => ({
      address: props.address,
      cancellationPolicy: props.cancellationPolicy,
      name,
      rooms,
      studioId: props.studioId,
    })),
  );

export { createStudio };
export type { CreateStudioProps, Studio };
