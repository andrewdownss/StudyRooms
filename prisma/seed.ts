import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Check if rooms already exist
  const existingRooms = await prisma.room.count();

  if (existingRooms > 0) {
    console.log(
      `✅ Database already has ${existingRooms} rooms. Skipping seed.`
    );
    return;
  }

  // Create default rooms
  console.log("Creating default rooms...");

  const rooms = await prisma.room.createMany({
    data: [
      {
        name: "Addlestone 136",
        category: "large",
        capacity: 8,
        description: "Large study room 136 (first floor) - supports up to eight students.",
      },
      {
        name: "Addlestone 228",
        category: "small",
        capacity: 5,
        description: "Small study room 228 (second floor) - ideal for quiet study.",
      },
      {
        name: "Addlestone 229",
        category: "small",
        capacity: 5,
        description: "Small study room 229 (second floor).",
      },
      {
        name: "Addlestone 230",
        category: "small",
        capacity: 5,
        description: "Small study room 230 (second floor).",
      },
      {
        name: "Addlestone 231",
        category: "small",
        capacity: 5,
        description: "Small study room 231 (second floor).",
      },
      {
        name: "Addlestone 232",
        category: "small",
        capacity: 5,
        description: "Small study room 232 (second floor).",
      },
      {
        name: "Addlestone 233",
        category: "small",
        capacity: 5,
        description: "Small study room 233 (second floor).",
      },
      {
        name: "Addlestone 234",
        category: "small",
        capacity: 5,
        description: "Small study room 234 (second floor).",
      },
      {
        name: "Addlestone 236",
        category: "large",
        capacity: 8,
        description: "Large study room 236 (second floor) - supports up to eight students.",
      },
      {
        name: "Addlestone 327",
        category: "small",
        capacity: 5,
        description: "Small study room 327 (third floor).",
      },
      {
        name: "Addlestone 328",
        category: "small",
        capacity: 5,
        description: "Small study room 328 (third floor).",
      },
      {
        name: "Addlestone 329",
        category: "small",
        capacity: 5,
        description: "Small study room 329 (third floor).",
      },
      {
        name: "Addlestone 330",
        category: "small",
        capacity: 5,
        description: "Small study room 330 (third floor).",
      },
      {
        name: "Addlestone 331",
        category: "small",
        capacity: 5,
        description: "Small study room 331 (third floor).",
      },
      {
        name: "Addlestone 332",
        category: "small",
        capacity: 5,
        description: "Small study room 332 (third floor).",
      },
      {
        name: "Addlestone 333",
        category: "small",
        capacity: 5,
        description: "Small study room 333 (third floor).",
      },
      {
        name: "Addlestone 334",
        category: "small",
        capacity: 5,
        description: "Small study room 334 (third floor).",
      },
      {
        name: "Addlestone 335",
        category: "small",
        capacity: 5,
        description: "Small study room 335 (third floor).",
      },
      {
        name: "Addlestone 336",
        category: "small",
        capacity: 5,
        description: "Small study room 336 (third floor).",
      },
      {
        name: "Addlestone 337",
        category: "small",
        capacity: 5,
        description: "Small study room 337 (third floor).",
      },
    ],
  });

  console.log(`✅ Created ${rooms.count} rooms successfully!`);

  // Display created rooms
  const allRooms = await prisma.room.findMany();
  console.log("\n📚 Created Rooms:");
  allRooms.forEach((room) => {
    console.log(
      `  - ${room.name} (${room.category}, capacity: ${room.capacity})`
    );
  });

  console.log("\n✅ Seed completed successfully!");
  console.log("   All rooms are available for booking.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
