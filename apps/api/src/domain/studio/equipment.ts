import type { EquipmentId } from "@my-app/shared";

import type { Money } from "../shared/money.js";

const MIN_NAME_LENGTH = 1;

interface EquipmentProps {
  equipmentId: EquipmentId;
  name: string;
  rentalFee: Money;
}

class Equipment {
  readonly equipmentId: EquipmentId;
  readonly name: string;
  readonly rentalFee: Money;

  private constructor(props: EquipmentProps) {
    this.equipmentId = props.equipmentId;
    this.name = props.name;
    this.rentalFee = props.rentalFee;
  }

  static create(props: EquipmentProps): Equipment {
    if (props.name.length < MIN_NAME_LENGTH) {
      throw new Error("Equipment name must not be empty");
    }
    return new Equipment(props);
  }

  equals(other: Equipment): boolean {
    return this.equipmentId === other.equipmentId;
  }
}

export type { EquipmentProps };
export { Equipment };
