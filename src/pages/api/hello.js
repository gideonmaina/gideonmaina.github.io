export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Hello from Gideon's API!",
      timestamp: new Date().toISOString(),
      status: "Server-side rendering is working!",
      projects: {
        sensors_africa: "Air quality monitoring platform",
        iot_projects: "Various IoT sensor implementations",
        electrical_designs: "Power system and circuit designs",
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    },
  );
}

export async function POST({ request }) {
  try {
    const body = await request.json();

    return new Response(
      JSON.stringify({
        message: "Contact form received",
        received: body,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return new Response(
      JSON.stringify({
        error: "Invalid JSON",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
