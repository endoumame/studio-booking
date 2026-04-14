import { toPolicyId, toRoomId, toStudioId } from "../../infrastructure/brand-helpers.js";
import { Address } from "../../domain/shared/address.js";
import { CancellationPolicy } from "../../domain/studio/cancellation-policy.js";
import { CancellationRule } from "../../domain/shared/cancellation-rule.js";
import { Money } from "../../domain/shared/money.js";
import { Room } from "../../domain/studio/room.js";
import { Studio } from "../../domain/studio/studio.js";

const DEFAULT_REFUND_RATE = 100;
const DEFAULT_DAYS_BEFORE = 0;

interface CreateStudioBody {
  name: string;
  prefecture: string;
  city: string;
  street: string;
  zipCode: string;
}

interface AddRoomBody {
  name: string;
  capacity: number;
  hourlyRate: number;
}

const buildStudio = (body: CreateStudioBody): Studio => {
  const studioId = toStudioId(crypto.randomUUID());
  const address = Address.create(body);
  const defaultRule = CancellationRule.create(DEFAULT_DAYS_BEFORE, DEFAULT_REFUND_RATE);
  const cancellationPolicy = CancellationPolicy.create({
    policyId: toPolicyId(crypto.randomUUID()),
    rules: [defaultRule],
  });
  return Studio.create({ address, cancellationPolicy, name: body.name, rooms: [], studioId });
};

const buildRoom = (body: AddRoomBody): Room =>
  Room.create({
    capacity: body.capacity,
    equipment: [],
    hourlyRate: Money.create(body.hourlyRate),
    name: body.name,
    roomId: toRoomId(crypto.randomUUID()),
  });

export type { AddRoomBody, CreateStudioBody };
export { buildRoom, buildStudio };
