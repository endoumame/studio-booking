const MIN_LENGTH = 0;

interface AddressProps {
  prefecture: string;
  city: string;
  street: string;
  zipCode: string;
}

class Address {
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zipCode: string;

  private constructor(props: AddressProps) {
    this.prefecture = props.prefecture;
    this.city = props.city;
    this.street = props.street;
    this.zipCode = props.zipCode;
  }

  static create(props: AddressProps): Address {
    if (props.prefecture.length === MIN_LENGTH) {
      throw new Error("Prefecture must not be empty");
    }
    if (props.city.length === MIN_LENGTH) {
      throw new Error("City must not be empty");
    }
    if (props.street.length === MIN_LENGTH) {
      throw new Error("Street must not be empty");
    }
    if (props.zipCode.length === MIN_LENGTH) {
      throw new Error("ZipCode must not be empty");
    }
    return new Address(props);
  }

  equals(other: Address): boolean {
    return (
      this.prefecture === other.prefecture &&
      this.city === other.city &&
      this.street === other.street &&
      this.zipCode === other.zipCode
    );
  }
}

export type { AddressProps };
export { Address };
