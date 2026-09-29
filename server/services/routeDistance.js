const getRoute = async (origin, destination, departureDate) => {
  const apiKey = process.env.ROUTING_API_KEY;
  if (!apiKey) {
    const error = new Error("Outstation routing is not configured on this server");
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration" },
    body: JSON.stringify({ origin: { address: origin }, destination: { address: destination }, travelMode: "DRIVE", departureTime: departureDate.toISOString() }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.routes?.[0]?.distanceMeters) {
    const error = new Error("Unable to calculate a verified driving route for these locations");
    error.statusCode = 422;
    throw error;
  }
  return { distanceKm: Math.ceil(Number(result.routes[0].distanceMeters) / 1000), duration: result.routes[0].duration || null };
};

module.exports = { getRoute };
