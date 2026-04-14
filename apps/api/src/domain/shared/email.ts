const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class Email {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Email {
    if (!EMAIL_PATTERN.test(value)) {
      throw new Error("Invalid email format");
    }
    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

export { Email };
