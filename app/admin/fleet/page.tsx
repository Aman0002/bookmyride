import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { addRoute, toggleRoute, addCar, toggleCar } from "../actions";

export default async function AdminFleet() {
  const [routes, cars] = await Promise.all([
    prisma.route.findMany({ orderBy: { destination: "asc" } }),
    prisma.car.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-slate-900">Routes & Cars</h1>

      {/* Routes */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Routes</h2>
        <Card className="p-6">
          <form action={addRoute} className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <div>
              <Label>Origin</Label>
              <Input name="origin" defaultValue="Hisar" required />
            </div>
            <div>
              <Label>Destination</Label>
              <Input name="destination" placeholder="e.g. Rohtak" required />
            </div>
            <Button type="submit">Add route</Button>
          </form>
        </Card>
        <div className="mt-3 space-y-2">
          {routes.map((r) => (
            <Card key={r.id} className="flex items-center justify-between p-4">
              <span className="font-medium text-slate-900">
                {r.origin} → {r.destination}
              </span>
              <div className="flex items-center gap-2">
                {r.active ? <Badge color="green">Active</Badge> : <Badge>Hidden</Badge>}
                <form action={toggleRoute}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button size="sm" variant="outline">
                    {r.active ? "Hide" : "Show"}
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cars */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Cars</h2>
        <Card className="p-6">
          <form action={addCar} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Name/model</Label>
              <Input name="name" placeholder="Maruti Baleno" required />
            </div>
            <div>
              <Label>Plate number</Label>
              <Input name="plateNumber" placeholder="HR-39-A-0000" required />
            </div>
            <div>
              <Label>Seats</Label>
              <Input type="number" name="totalSeats" defaultValue={4} />
            </div>
            <div>
              <Label>Fuel type</Label>
              <Input name="fuelType" placeholder="CNG + Petrol" />
            </div>
            <div>
              <Label>Driver name</Label>
              <Input name="driverName" placeholder="Driver full name" />
            </div>
            <div>
              <Label>Driver phone</Label>
              <Input name="driverPhone" placeholder="+91 9xxxxxxxxx" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Add / update car
              </Button>
            </div>
          </form>
        </Card>
        <div className="mt-3 space-y-2">
          {cars.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div>
                <span className="font-medium text-slate-900">
                  {c.name}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    ({c.plateNumber}) · {c.totalSeats} seats
                    {c.fuelType ? ` · ${c.fuelType}` : ""}
                  </span>
                </span>
                <div className="text-sm text-slate-500">
                  {c.driverName || "No driver set"}
                  {c.driverPhone ? ` · ${c.driverPhone}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.active ? <Badge color="green">Active</Badge> : <Badge>Inactive</Badge>}
                <form action={toggleCar}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button size="sm" variant="outline">
                    {c.active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
