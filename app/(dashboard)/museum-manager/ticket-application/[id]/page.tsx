import { notFound } from "next/navigation";
import { TicketDetailPanel } from "@/components/museum-manager/ticket-detail-panel";
import { getTicketDetailForManager } from "@/services/museum-manager/ticket.service";
import { getManagedMuseum } from "@/services/museum-manager/museum.service";
import { getExhibitionList } from "@/services/content-manager/exhibition.service";
import { getServerAccessToken } from "@/services/auth/resolve-access-token.server";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = Number(id);

  if (Number.isNaN(ticketId)) {
    notFound();
  }

  const token = await getServerAccessToken();

  try {
    const [ticket, museum, exhibitions] = await Promise.all([
      getTicketDetailForManager(ticketId, token),
      getManagedMuseum(),
      getExhibitionList(),
    ]);

    if (!ticket) {
      notFound();
    }

    const filteredExhibitions = exhibitions.filter((ex) => ex.museumId === museum?.id);

    return (
      <TicketDetailPanel
        initialTicket={ticket}
        exhibitions={filteredExhibitions}
        museumId={museum?.id ?? null}
      />
    );
  } catch (err) {
    console.error("Failed to load ticket detail page:", err);
    notFound();
  }
}
