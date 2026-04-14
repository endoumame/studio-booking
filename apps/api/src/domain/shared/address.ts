import { err, ok } from "neverthrow";
import type { DomainError } from "./errors.js";
import type { Result } from "neverthrow";
import { validation } from "./errors.js";

const MIN_LENGTH = 0;

interface Address {
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zipCode: string;
}

const createAddress = (props: Address): Result<Address, DomainError> => {
  if (props.prefecture.length === MIN_LENGTH) {
    return err(validation("Prefecture must not be empty"));
  }
  if (props.city.length === MIN_LENGTH) {
    return err(validation("City must not be empty"));
  }
  if (props.street.length === MIN_LENGTH) {
    return err(validation("Street must not be empty"));
  }
  if (props.zipCode.length === MIN_LENGTH) {
    return err(validation("ZipCode must not be empty"));
  }
  return ok({ ...props });
};

const addressEquals = (left: Address, right: Address): boolean =>
  left.prefecture === right.prefecture &&
  left.city === right.city &&
  left.street === right.street &&
  left.zipCode === right.zipCode;

export { addressEquals, createAddress };
export type { Address };
