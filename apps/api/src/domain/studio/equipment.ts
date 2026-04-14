import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { EquipmentId } from "@my-app/shared";
import type { Money } from "../shared/money.js";
import type { Result } from "neverthrow";
import { validation } from "../shared/errors.js";

const MIN_NAME_LENGTH = 0;

interface Equipment {
  readonly equipmentId: EquipmentId;
  readonly name: string;
  readonly rentalFee: Money;
}

interface CreateEquipmentProps {
  readonly equipmentId: EquipmentId;
  readonly name: string;
  readonly rentalFee: Money;
}

const createEquipment = (props: CreateEquipmentProps): Result<Equipment, DomainError> => {
  if (props.name.trim().length === MIN_NAME_LENGTH) {
    return err(validation("Equipment name must not be empty"));
  }
  return ok({
    equipmentId: props.equipmentId,
    name: props.name.trim(),
    rentalFee: props.rentalFee,
  });
};

export { createEquipment };
export type { CreateEquipmentProps, Equipment };
