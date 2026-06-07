const { Event } = require('./src/database/models');

async function testInsert() {
    try {
        console.log("Creating event...");
        const event = await Event.create({
            userId: 1,
            eventName: "Paid Event",
            eventDate: "2026-10-01",
            isListed: true,
            price: 5000,
            currency: 'NGN'
        });
        console.log("Created event:", event.toJSON());
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
}

testInsert();
