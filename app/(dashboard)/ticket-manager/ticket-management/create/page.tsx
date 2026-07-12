import { CreateTicketForm } from "@/components/ticket-manager/create-ticket-form";
import { getMuseumProfileEntry } from "@/services/admin";

export default async function CreateTicketPage() {
  const museum = await getMuseumProfileEntry();

  return <CreateTicketForm museumId={museum?.id ?? null} />;
}
