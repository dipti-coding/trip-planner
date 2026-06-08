from pydantic import AnyHttpUrl, BaseModel


class ActivityDetails(BaseModel):
    location: str | None = None
    booking_reference: str | None = None
    notes: str | None = None


class RestaurantDetails(BaseModel):
    reservation_name: str | None = None
    party_size: int | None = None
    confirmation: str | None = None
    dress_code: str | None = None


class MeetingDetails(BaseModel):
    meeting_link: AnyHttpUrl | None = None
    organizer: str | None = None
    attendees: list[str] = []
    notes: str | None = None


class FlightDetails(BaseModel):
    airline: str | None = None
    flight_number: str | None = None
    seat: str | None = None
    confirmation: str | None = None
    departure_airport: str | None = None
    arrival_airport: str | None = None
    terminal: str | None = None
    gate: str | None = None
    cabin_class: str | None = None


class HotelDetails(BaseModel):
    confirmation: str | None = None
    room_type: str | None = None
    loyalty_number: str | None = None


class CarReservationDetails(BaseModel):
    rental_company: str | None = None
    confirmation: str | None = None
    car_type: str | None = None
    pickup_location: str | None = None
    dropoff_location: str | None = None
    driver_name: str | None = None


class CruiseDetails(BaseModel):
    cruise_line: str | None = None
    ship_name: str | None = None
    confirmation: str | None = None
    cabin_number: str | None = None
    cabin_class: str | None = None
    port_of_departure: str | None = None
    port_of_arrival: str | None = None


class FerryDetails(BaseModel):
    operator: str | None = None
    confirmation: str | None = None
    departure_port: str | None = None
    arrival_port: str | None = None
    vessel_name: str | None = None
    seat_class: str | None = None


class RailwayRideDetails(BaseModel):
    operator: str | None = None
    train_number: str | None = None
    confirmation: str | None = None
    departure_station: str | None = None
    arrival_station: str | None = None
    car_number: str | None = None
    seat: str | None = None
    cabin_class: str | None = None


class BusRideDetails(BaseModel):
    operator: str | None = None
    confirmation: str | None = None
    departure_terminal: str | None = None
    arrival_terminal: str | None = None
    seat: str | None = None


