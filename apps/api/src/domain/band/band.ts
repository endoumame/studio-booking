import type { BandId, MemberId } from "@my-app/shared";
import { conflict, notFound, validation } from "../shared/errors.js";
import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";

const MIN_NAME_LENGTH = 0;

interface Band {
  readonly bandId: BandId;
  readonly name: string;
  readonly members: readonly MemberId[];
}

interface CreateBandProps {
  readonly bandId: BandId;
  readonly name: string;
  readonly members: readonly MemberId[];
}

const createBand = (props: CreateBandProps): Result<Band, DomainError> => {
  if (props.name.trim().length === MIN_NAME_LENGTH) {
    return err(validation("Band name must not be empty"));
  }
  return ok({
    bandId: props.bandId,
    members: [...props.members],
    name: props.name.trim(),
  });
};

const hasBandMember = (band: Band, memberId: MemberId): boolean => band.members.includes(memberId);

const addBandMember = (band: Band, memberId: MemberId): Result<Band, DomainError> => {
  if (hasBandMember(band, memberId)) {
    return err(conflict("Member is already in the band"));
  }
  return ok({
    ...band,
    members: [...band.members, memberId],
  });
};

const removeBandMember = (band: Band, memberId: MemberId): Result<Band, DomainError> => {
  if (!hasBandMember(band, memberId)) {
    return err(notFound("Member is not in the band"));
  }
  return ok({
    ...band,
    members: band.members.filter((id) => id !== memberId),
  });
};

export { addBandMember, createBand, hasBandMember, removeBandMember };
export type { Band, CreateBandProps };
