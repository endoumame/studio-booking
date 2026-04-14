import { Equipment } from "../equipment.js";
import type { EquipmentId } from "@my-app/shared";
import { Money } from "../../shared/money.js";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const EQUIPMENT_ID = "EQ-001" as EquipmentId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const OTHER_EQUIPMENT_ID = "EQ-002" as EquipmentId;
const RENTAL_FEE = 500;

describe("Equipment creation", () => {
  it("should create valid equipment with name and rental fee", () => {
    const fee = Money.create(RENTAL_FEE);
    const equipment = Equipment.create({
      equipmentId: EQUIPMENT_ID,
      name: "Microphone",
      rentalFee: fee,
    });

    expect(equipment.equipmentId).toBe(EQUIPMENT_ID);
    expect(equipment.name).toBe("Microphone");
    expect(equipment.rentalFee).toBe(fee);
  });

  it("should reject empty name", () => {
    const fee = Money.create(RENTAL_FEE);

    expect(() => Equipment.create({ equipmentId: EQUIPMENT_ID, name: "", rentalFee: fee })).toThrow(
      "Equipment name must not be empty",
    );
  });
});

describe("Equipment equality", () => {
  it("should be equal when equipmentId matches", () => {
    const fee = Money.create(RENTAL_FEE);
    const first = Equipment.create({ equipmentId: EQUIPMENT_ID, name: "Mic A", rentalFee: fee });
    const same = Equipment.create({ equipmentId: EQUIPMENT_ID, name: "Mic B", rentalFee: fee });

    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
  });

  it("should not be equal when equipmentId differs", () => {
    const fee = Money.create(RENTAL_FEE);
    const first = Equipment.create({ equipmentId: EQUIPMENT_ID, name: "Mic A", rentalFee: fee });
    const other = Equipment.create({
      equipmentId: OTHER_EQUIPMENT_ID,
      name: "Mic A",
      rentalFee: fee,
    });

    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(first.equals(other)).toBe(false);
  });
});
