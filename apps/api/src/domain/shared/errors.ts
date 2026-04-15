const DomainErrorTag = {
  CONFLICT: "CONFLICT",
  INVALID_STATE: "INVALID_STATE",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
} as const;

type DomainErrorTag = (typeof DomainErrorTag)[keyof typeof DomainErrorTag];

interface DomainError {
  readonly tag: DomainErrorTag;
  readonly message: string;
}

const validation = (message: string): DomainError => ({
  message,
  tag: DomainErrorTag.VALIDATION,
});

const notFound = (message: string): DomainError => ({
  message,
  tag: DomainErrorTag.NOT_FOUND,
});

const conflict = (message: string): DomainError => ({
  message,
  tag: DomainErrorTag.CONFLICT,
});

const invalidState = (message: string): DomainError => ({
  message,
  tag: DomainErrorTag.INVALID_STATE,
});

export { conflict, DomainErrorTag, invalidState, notFound, validation };
export type { DomainError };
