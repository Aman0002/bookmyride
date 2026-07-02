import { prisma } from "@/lib/prisma";
import { HISAR_CENTER } from "@/lib/geo";
import { Button, Card, Input, Label } from "@/components/ui";
import { updateServiceArea } from "../actions";

export default async function AdminSettings() {
  const area = await prisma.serviceArea.findFirst();
  const centerLat = area?.centerLat ?? HISAR_CENTER.lat;
  const centerLng = area?.centerLng ?? HISAR_CENTER.lng;
  const radiusKm = area?.radiusKm ?? 10;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service area</h1>
        <p className="text-sm text-slate-500">
          Pickups are accepted only within this radius of the center point.
          Addresses outside are rejected before payment.
        </p>
      </div>

      <Card className="p-6">
        <form action={updateServiceArea} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Center latitude</Label>
              <Input
                type="number"
                step="0.0001"
                name="centerLat"
                defaultValue={centerLat}
              />
            </div>
            <div>
              <Label>Center longitude</Label>
              <Input
                type="number"
                step="0.0001"
                name="centerLng"
                defaultValue={centerLng}
              />
            </div>
          </div>
          <div>
            <Label>Radius (km)</Label>
            <Input
              type="number"
              step="0.5"
              name="radiusKm"
              defaultValue={radiusKm}
            />
          </div>
          <Button type="submit">Save service area</Button>
        </form>
      </Card>

      <p className="text-xs text-slate-400">
        Tip: default center is Hisar city ({HISAR_CENTER.lat}, {HISAR_CENTER.lng}).
        Use Google Maps to fine-tune coordinates for your office/pickup hub.
      </p>
    </div>
  );
}
