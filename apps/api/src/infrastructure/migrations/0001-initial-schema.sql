-- events table (Event Sourcing)
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  stream_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  UNIQUE(stream_id, version)
);

-- Read models (CQRS)
CREATE TABLE read_bookings (
  booking_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  band_id TEXT,
  room_id TEXT NOT NULL,
  status TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_method TEXT,
  payment_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE studios (
  studio_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  zip_code TEXT NOT NULL
);

CREATE TABLE rooms (
  room_id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES studios(studio_id),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  hourly_rate INTEGER NOT NULL
);

CREATE TABLE equipment (
  equipment_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rental_fee INTEGER NOT NULL
);

CREATE TABLE members (
  member_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE member_cards (
  card_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL UNIQUE REFERENCES members(member_id),
  card_number TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  issued_at TEXT NOT NULL
);

CREATE TABLE bands (
  band_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE band_members (
  band_id TEXT NOT NULL REFERENCES bands(band_id),
  member_id TEXT NOT NULL REFERENCES members(member_id),
  PRIMARY KEY (band_id, member_id)
);

-- Indexes
CREATE INDEX idx_events_stream ON events(stream_id, stream_type);
CREATE INDEX idx_read_bookings_member ON read_bookings(member_id);
CREATE INDEX idx_read_bookings_room_time ON read_bookings(room_id, start_time, end_time);
CREATE INDEX idx_rooms_studio ON rooms(studio_id);
