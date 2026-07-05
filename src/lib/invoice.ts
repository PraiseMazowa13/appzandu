import { jsPDF } from "jspdf";
import { formatPrice } from "@/stores/cart";

export type InvoiceOrder = {
  id: string;
  created_at: string;
  total_cents: number;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  customer_city: string | null;
  items: {
    product_name: string;
    unit_price_cents: number;
    quantity: number;
  }[];
};

const formatFC = (n: number) => formatPrice(n);

export function generateInvoicePDF(order: InvoiceOrder) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  // Header brand block
  doc.setFillColor(228, 82, 66);
  doc.roundedRect(margin, y - 20, 42, 42, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Z", margin + 14, y + 8);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(22);
  doc.text("Zandu", margin + 56, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text("Vos essentiels, livrés en un éclair", margin + 56, y + 20);

  // Invoice title
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FACTURE", pageWidth - margin, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`N° ${order.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, y + 14, {
    align: "right",
  });
  doc.text(
    new Date(order.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    pageWidth - margin,
    y + 28,
    { align: "right" },
  );

  y += 60;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // Customer block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("FACTURÉ À", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(order.customer_name || "Client", margin, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  if (order.customer_address)
    doc.text(order.customer_address, margin, y + 32);
  if (order.customer_city) doc.text(order.customer_city, margin, y + 46);
  if (order.customer_phone)
    doc.text(`Tél : ${order.customer_phone}`, margin, y + 60);

  // Status
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("STATUT", pageWidth - margin, y, { align: "right" });
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(order.status.toUpperCase(), pageWidth - margin, y + 16, {
    align: "right",
  });

  y += 90;

  // Table header
  doc.setFillColor(248, 245, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("PRODUIT", margin + 12, y + 17);
  doc.text("QTÉ", pageWidth - margin - 200, y + 17, { align: "right" });
  doc.text("PU", pageWidth - margin - 100, y + 17, { align: "right" });
  doc.text("TOTAL", pageWidth - margin - 12, y + 17, { align: "right" });
  y += 34;

  // Items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  order.items.forEach((it) => {
    const lineTotal = it.unit_price_cents * it.quantity;
    const wrapped = doc.splitTextToSize(it.product_name, 240);
    doc.text(wrapped, margin + 12, y + 6);
    doc.text(String(it.quantity), pageWidth - margin - 200, y + 6, {
      align: "right",
    });
    doc.text(formatFC(it.unit_price_cents), pageWidth - margin - 100, y + 6, {
      align: "right",
    });
    doc.text(formatFC(lineTotal), pageWidth - margin - 12, y + 6, {
      align: "right",
    });
    y += Math.max(22, wrapped.length * 14 + 8);
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
  });

  // Totals
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Sous-total", pageWidth - margin - 100, y, { align: "right" });
  doc.setTextColor(20, 20, 20);
  doc.text(formatFC(order.total_cents), pageWidth - margin - 12, y, {
    align: "right",
  });
  y += 18;
  doc.setTextColor(110, 110, 110);
  doc.text("Livraison", pageWidth - margin - 100, y, { align: "right" });
  doc.setTextColor(20, 20, 20);
  doc.text("À convenir", pageWidth - margin - 12, y, { align: "right" });

  y += 24;
  doc.setFillColor(228, 82, 66);
  doc.roundedRect(pageWidth - margin - 220, y, 220, 40, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL À PAYER", pageWidth - margin - 208, y + 24);
  doc.setFontSize(14);
  doc.text(formatFC(order.total_cents), pageWidth - margin - 12, y + 25, {
    align: "right",
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 60;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Paiement Mobile Money : 0895 975 170  •  Merci pour votre confiance !",
    pageWidth / 2,
    footerY + 20,
    { align: "center" },
  );
  doc.text(
    `Zandu — République Démocratique du Congo`,
    pageWidth / 2,
    footerY + 34,
    { align: "center" },
  );

  doc.save(`facture-zandu-${order.id.slice(0, 8)}.pdf`);
}
