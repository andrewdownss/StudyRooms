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
        name: "Study Room 101",
        category: "small",
        capacity: 4,
        description:
          "Small study room on the first floor - Perfect for focused individual study or small group work",
      },
      {
        name: "Study Room 102",
        category: "small",
        capacity: 4,
        description:
          "Small study room on the first floor - Quiet space ideal for concentration",
      },
      {
        name: "Study Room 103",
        category: "small",
        capacity: 4,
        description:
          "Small study room on the first floor - Great for exam preparation",
      },
      {
        name: "Study Room 104",
        category: "small",
        capacity: 4,
        description:
          "Small study room on the first floor - Equipped with whiteboard",
      },
      {
        name: "Study Room 201",
        category: "large",
        capacity: 12,
        description:
          "Large study room on the second floor - Perfect for group projects and presentations",
      },
      {
        name: "Study Room 202",
        category: "large",
        capacity: 12,
        description:
          "Large study room on the second floor - Ideal for team collaboration",
      },
      {
        name: "Study Room 203",
        category: "large",
        capacity: 10,
        description:
          "Large study room on the second floor - Great for study groups",
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
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
