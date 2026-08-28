export const statusConfig: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'สร้างแล้ว', color: 'bg-gray-100 text-gray-700' },
  ASSIGNED: { label: 'มอบหมายแล้ว', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'กำลังทำ', color: 'bg-yellow-100 text-yellow-700' },
  PENDING_REVIEW: { label: 'รอตรวจ', color: 'bg-purple-100 text-purple-700' },
  APPROVED: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'ถูกตีกลับ', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'ยกเลิกแล้ว', color: 'bg-gray-100 text-gray-500' },
};