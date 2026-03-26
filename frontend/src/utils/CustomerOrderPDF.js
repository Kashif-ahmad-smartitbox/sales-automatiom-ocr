import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { logoBase64 } from "../assets/logoBase64";
import { formatDateDDMmmYYYY } from "./tableHelpers";

// Configure VFS and register fonts
const vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || (pdfFonts?.default?.pdfMake?.vfs);
if (vfs) {
    pdfMake.vfs = vfs;
}

pdfMake.fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

// Helper: Format number in Indian format
function formatIndianNumber(num) {
  if (num === null || num === undefined) return "0";
  const rounded = Math.round(parseFloat(num));
  const numStr = rounded.toString();
  const lastThree = numStr.slice(-3);
  const otherNumbers = numStr.slice(0, -3);
  const formattedInteger = otherNumbers
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;
  return formattedInteger;
}

// Helper: Convert number to words (INR)
function INR(input) {
  const rupees = Number(parseInt(input, 10));
  const output = [];

  if (rupees === 0) {
    output.push("zero");
  } else if (rupees === 1) {
    output.push("one");
  } else {
    const crores = Math.floor(rupees / 10000000) % 100;
    if (crores > 0) output.push(`${getHundreds(crores)} crore`);

    const lakhs = Math.floor(rupees / 100000) % 100;
    if (lakhs > 0) output.push(`${getHundreds(lakhs)} lakh`);

    const thousands = Math.floor(rupees / 1000) % 100;
    if (thousands > 0) output.push(`${getHundreds(thousands)} thousand`);

    const hundreds = Math.floor((rupees % 1000) / 100);
    if (hundreds > 0 && hundreds < 10)
      output.push(`${getOnes(hundreds)} hundred`);

    const tens = rupees % 100;
    if (tens > 0) {
      if (rupees > 100) output.push("and");
      output.push(`${getHundreds(tens)}`);
    }
  }

  return ["Rupees", ...output, "only"]
    .join(" ")
    .split(/\s+/)
    .filter((e) => e)
    .map((e) => e.substr(0, 1).toUpperCase() + e.substr(1))
    .join(" ");
}

function getOnes(number) {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  return ones[number] || "";
}

function getTeens(number) {
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  return teens[number] || "";
}

function getTens(number) {
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  return tens[number] || "";
}

function getHundreds(num) {
  if (num > 0 && num < 10) return getOnes(num);
  if (num >= 10 && num < 20) return getTeens(num % 10);
  if (num >= 20 && num < 100)
    return `${getTens(Math.floor(num / 10))} ${getOnes(num % 10)}`.trim();
  return "";
}

const CustomerOrderPDF = {
  generatePDFBlob: async (orderData, companyInfo = {}) => {
    try {
        const items = orderData.ordered_items || [];
        
        // --- Company Header Info (Dynamic) ---
        const companyName = String(companyInfo.company_name || "SMART ITBox").toUpperCase();
        const companyAddress = String(companyInfo.head_office_location || "N/A");
        const companyGST = String(companyInfo.gst || "N/A");
        const companyContact = `Contact: ${String(companyInfo.admin_email || 'N/A')}, Mob: ${String(companyInfo.admin_mobile || 'N/A')}`;

        // --- Party Info (Dynamic) ---
        const partyName = String(orderData.dealer_name || "Unknown Dealer");
        const partyAddress = String(orderData.dealer_address || "N/A");
        const partyCity = String(orderData.dealer_city || "N/A");
        const customerGST = String(orderData.dealer_gstin || "NA");

        // --- Order Info ---
        const orderNo = String(orderData.invoice_number || orderData.id || "");
        const orderDate = formatDateDDMmmYYYY(orderData.check_in_time);
        const status = String(orderData.order_status || 'Pending');
        
        // --- Table Mapping (Data-backed columns only) ---
        let subTotal = 0;
        let totalQty = 0;
        
        const itemRows = items.map((item, index) => {
            const qty = Number(item.quantity || 0);
            const rate = Number(item.rate || 0);
            const total = qty * rate;
            subTotal += total;
            totalQty += qty;
            
            return [
                (index + 1).toString(),
                String(item.name || "Item"), 
                qty.toString(),
                formatIndianNumber(rate),
                formatIndianNumber(total),
            ];
        });

        const grandTotal = subTotal;
        const itemHeaders = ["S.No", "Item Description", "Qty", "Rate", "Amount"];

        const docDefinition = {
          pageSize: "A4",
          pageMargins: [30, 30, 30, 30],
          content: [
            // ─── Header: Logo + Company Info ───
            {
              columns: [
                logoBase64 ? { image: logoBase64, width: 70, alignment: "left" } : { width: 70, text: "" },
                {
                  stack: [
                    { text: companyName, bold: true, fontSize: 16, alignment: "center" },
                    { text: companyAddress, fontSize: 9, alignment: "center", margin: [0, 2, 0, 1], color: "#555555" },
                    { text: `GSTIN: ${companyGST}`, fontSize: 9, alignment: "center", margin: [0, 0, 0, 2], bold: true },
                    { text: companyContact, fontSize: 8, alignment: "center", color: "#555555" },
                  ],
                  width: "*",
                },
                { width: 50, text: "" }, 
              ],
              margin: [0, 0, 0, 15],
            },

            // Divider Line
            {
                canvas: [{ type: 'line', x1: 0, y1: 5, x2: 535, y2: 5, lineWidth: 1, lineColor: '#eeeeee' }],
                margin: [0, 0, 0, 10]
            },

            {
              text: "ORDER ACKNOWLEDGEMENT RECEIPT",
              bold: true,
              fontSize: 12,
              alignment: "center",
              margin: [0, 5, 0, 15],
              color: '#2563eb'
            },

            // Billing & Order Details
            {
              table: {
                widths: ["60%", "40%"],
                body: [
                  [
                    {
                      text: [
                        { text: "Bill To:\n", bold: true, fontSize: 10, color: '#6b7280' },
                        { text: `${partyName}\n`, bold: true, fontSize: 11 },
                        { text: `Address: ${partyAddress}, ${partyCity}\n`, fontSize: 9 },
                        { text: `GST No: ${customerGST}`, fontSize: 9, bold: true }
                      ],
                      border: [true, true, true, true],
                      margin: [10, 10, 10, 10],
                      fillColor: '#f9fafb'
                    },
                    {
                      text: [
                        { text: "Order Details:\n", bold: true, fontSize: 10, color: '#6b7280' },
                        { text: `Order No: `, fontSize: 9 }, { text: `${orderNo}\n`, bold: true },
                        { text: `Order Date: `, fontSize: 9 }, { text: `${orderDate}\n` },
                        { text: `Status: `, fontSize: 9 }, { text: `${status}`, bold: true }
                      ],
                      border: [false, true, true, true],
                      margin: [10, 10, 10, 10],
                      fillColor: '#f9fafb'
                    }
                  ]
                ],
              },
              layout: {
                hLineColor: () => "#e5e7eb",
                vLineColor: () => "#e5e7eb",
              },
              margin: [0, 0, 0, 15],
            },

            // Main Table
            {
              table: {
                headerRows: 1,
                widths: [25, "*", 50, 70, 80],
                body: [
                  itemHeaders.map((header) => ({ text: header.toUpperCase(), style: "tableHeader" })),
                  ...itemRows.map((row) =>
                    row.map((cell, idx) => ({ 
                        text: cell, 
                        style: "tableData",
                        alignment: idx >= 3 ? "right" : (idx === 2 ? "center" : "left")
                    }))
                  ),
                  [
                    { text: "TOTAL QUANTITY", colSpan: 2, alignment: "right", bold: true, fontSize: 9, margin: [0, 5, 5, 5], fillColor: '#f8fafc' },
                    {}, 
                    { text: totalQty.toString(), bold: true, alignment: "center", fontSize: 10, margin: [0, 5, 0, 5], fillColor: '#f8fafc' },
                    { text: "GRAND TOTAL", alignment: "right", bold: true, fontSize: 9, margin: [0, 5, 5, 5], fillColor: '#f8fafc' },
                    { text: `₹${formatIndianNumber(grandTotal)}`, alignment: "right", bold: true, fontSize: 11, margin: [0, 5, 0, 5], fillColor: '#f8fafc', color: '#16a34a' }
                  ]
                ],
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => "#e5e7eb",
                vLineColor: () => "#e5e7eb"
              },
              margin: [0, 5, 0, 15],
            },

            // Summary
            {
                stack: [
                    { text: 'AMOUNT IN WORDS:', fontSize: 8, color: '#6b7280', bold: true },
                    { text: INR(grandTotal), fontSize: 10, bold: true, color: '#374151' }
                ],
                margin: [0, 0, 0, 20]
            },

            // Terms and Footer
            {
              columns: [
                {
                  width: "60%",
                  stack: [
                    { text: "TERMS & CONDITIONS:", bold: true, fontSize: 9, margin: [0, 0, 0, 5], color: '#4b5563' },
                    { text: "1. Goods once sold will be subject to our standard return policy.", fontSize: 8, margin: [0, 2, 0, 0] },
                    { text: "2. Payment is due within the stipulated time frame.", fontSize: 8, margin: [0, 2, 0, 0] },
                    { text: "3. This receipt is computer generated and does not require a physical signature.", fontSize: 8, margin: [0, 2, 0, 0] },
                  ],
                },
                {
                  width: "40%",
                  stack: [
                    { text: "E & O.E.", bold: true, fontSize: 9, alignment: "right", margin: [0, 0, 0, 10] },
                    {
                      stack: [
                        { text: `For ${companyName}`, bold: true, fontSize: 9, alignment: "right" },
                        { text: "(Authorised Signatory)", fontSize: 9, alignment: "right", margin: [0, 40, 0, 0], bold: true },
                      ],
                      alignment: "right",
                    },
                  ],
                },
              ],
            },
          ],
          styles: {
            tableHeader: { bold: true, fontSize: 9, alignment: "center", fillColor: "#1e293b", color: "white", margin: [0, 5, 0, 5] },
            tableData: { fontSize: 9, alignment: "left", color: "#1f2937", margin: [0, 3, 0, 3] },
          },
          defaultStyle: { font: "Roboto" },
          ...(logoBase64
            ? {
                background: [
                  { image: logoBase64, width: 400, height: 400, opacity: 0.05, absolutePosition: { x: 100, y: 200 }, angle: 45 },
                ],
              }
            : {}),
        };

        console.log("Triggering PDF download...");
        pdfMake.createPdf(docDefinition).download(`Invoice-${orderNo}.pdf`);
        return true;
    } catch (err) {
        console.error("PDF Logic Error:", err);
        throw err;
    }
  },
};

export const downloadOrderPDF = async (orderData, companyInfo = {}) => {
  try {
    await CustomerOrderPDF.generatePDFBlob(orderData, companyInfo);
  } catch (err) {
    console.error("Download Error:", err);
    alert(`Failed to download PDF: ${err.message}`);
  }
};

export default CustomerOrderPDF;
