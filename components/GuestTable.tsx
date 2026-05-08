import { format } from "date-fns";
import Link from "next/link";
import { Eye, Trash2, FileText } from "lucide-react";

type Guest = {
  id: string;
  name: string;
  numberOfGuests: number;
  checkInDate: string;
  checkOutDate: string;
  idProofType: string;
  documents: { id: string }[];
};

export default function GuestTable({ guests, onDelete }: { guests: Guest[], onDelete: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {guests.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <p>No guests found.</p>
          <Link href="/guests/new" className="text-blue-600 hover:underline mt-2 inline-block">
            Add your first guest
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Stay Duration</th>
                <th className="py-3 px-4">Guests</th>
                <th className="py-3 px-4">ID Type</th>
                <th className="py-3 px-4">Docs</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{guest.name}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {format(new Date(guest.checkInDate), "MMM d, yyyy")} -{" "}
                    {format(new Date(guest.checkOutDate), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4">{guest.numberOfGuests}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {guest.idProofType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>{guest.documents.length}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/guests/${guest.id}`}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => onDelete(guest.id)}
                        className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                        title="Delete Guest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
