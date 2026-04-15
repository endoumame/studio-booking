import { err, ok } from "neverthrow";
import type { DomainError } from "./errors.js";
import type { Result } from "neverthrow";
import { validation } from "./errors.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Email {
  readonly value: string;
}

const createEmail = (value: string): Result<Email, DomainError> => {
  if (!EMAIL_PATTERN.test(value)) {
    return err(validation("Invalid email format"));
  }
  return ok({ value });
};

const emailEquals = (left: Email, right: Email): boolean => left.value === right.value;

export { createEmail, emailEquals };
export type { Email };
