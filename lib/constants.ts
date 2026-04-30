export const MAX_PRICE = 5_000_000;

// Các quận/huyện bị loại trừ (Q2, Q9 đã sáp nhập vào TP Thủ Đức)
export const EXCLUDED_DISTRICT_KEYWORDS = [
  'quận 2', 'quan 2', 'q.2', 'q2 ',
  'quận 9', 'quan 9', 'q.9', 'q9 ',
  'thủ đức', 'thu duc', 'thuduc',
  'tp. thủ đức', 'tp thủ đức', 'thành phố thủ đức',
  'district 2', 'district 9',
];

// Danh sách quận/huyện hợp lệ tại TP.HCM
export const VALID_DISTRICTS = [
  'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6',
  'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12',
  'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú',
  'Bình Chánh', 'Cần Giờ', 'Củ Chi', 'Hóc Môn', 'Nhà Bè',
];

// Trường học theo quận/huyện
export const SCHOOLS_BY_DISTRICT: Record<string, string[]> = {
  'Quận 1': [
    'ĐH KHXH&NV TP.HCM', 'ĐH Luật TP.HCM', 'ĐH Mở TP.HCM',
    'THPT Lê Quý Đôn', 'THPT Trần Đại Nghĩa',
  ],
  'Quận 3': [
    'ĐH Y khoa Phạm Ngọc Thạch', 'ĐH Kinh tế TP.HCM',
    'THPT Võ Thị Sáu', 'THPT Nguyễn Thị Minh Khai', 'THPT Nguyễn Thượng Hiền',
  ],
  'Quận 4': [
    'CĐ Công thương', 'THPT Khánh Hội A',
  ],
  'Quận 5': [
    'ĐH Y Dược TP.HCM', 'ĐH Sư phạm TP.HCM', 'ĐH Khoa học Tự nhiên',
    'THPT Nguyễn Hữu Thọ', 'THPT Hùng Vương',
  ],
  'Quận 6': [
    'CĐ Bách Việt', 'ĐH Ngân hàng TP.HCM',
    'THPT Bình Phú', 'THPT Lê Thánh Tôn',
  ],
  'Quận 7': [
    'ĐH Tôn Đức Thắng', 'ĐH RMIT Việt Nam', 'ĐH Quốc tế SISU',
    'THPT Nguyễn Hữu Thọ (Q7)', 'THPT Phú Mỹ',
  ],
  'Quận 8': [
    'ĐH Sư phạm Kỹ thuật TP.HCM',
    'THPT Tạ Quang Bửu', 'THPT Nguyễn Huệ',
  ],
  'Quận 10': [
    'ĐH Công nghiệp Thực phẩm TP.HCM', 'ĐH Tôn Đức Thắng (Q10)',
    'CĐ Kinh tế Đối ngoại', 'ĐH Bách khoa TP.HCM',
    'THPT Nguyễn Du', 'THPT Lê Hồng Phong',
  ],
  'Quận 11': [
    'ĐH Kỹ thuật Công nghệ TP.HCM', 'CĐ Công nghệ TP.HCM',
    'THPT Bình Phú', 'THPT Nguyễn Chí Thanh',
  ],
  'Quận 12': [
    'ĐH Nông Lâm TP.HCM', 'CĐ Công nghệ TP.HCM (Q12)',
    'THPT Trung Phú', 'THPT An Nhơn Tây',
  ],
  'Bình Thạnh': [
    'ĐH Hutech', 'ĐH Kiến Trúc TP.HCM', 'ĐH Công Nghiệp TP.HCM',
    'ĐH Văn Hóa TP.HCM', 'CĐ Bán công Công nghệ & Quản trị DN',
    'THPT Gia Định', 'THPT Nguyễn Hữu Cảnh', 'THPT Bình Phú (BT)',
  ],
  'Gò Vấp': [
    'ĐH Quốc tế Hồng Bàng', 'ĐH Công nghệ Sài Gòn',
    'THPT Gò Vấp', 'THPT Nguyễn Trung Trực', 'THPT Thạnh Lộc',
  ],
  'Phú Nhuận': [
    'ĐH Hoa Sen', 'CĐ Phương Đông',
    'THPT Phú Nhuận', 'THPT Nguyễn Thái Bình',
  ],
  'Tân Bình': [
    'ĐH Văn Lang', 'ĐH Công nghệ Sài Gòn (TB)',
    'CĐ Bách khoa Sài Gòn', 'CĐ Sư phạm Trung ương',
    'THPT Nguyễn Hữu Thọ (TB)', 'THPT Trần Hưng Đạo', 'THPT Hoàng Hoa Thám',
  ],
  'Tân Phú': [
    'ĐH Sài Gòn', 'CĐ Kinh tế TP.HCM',
    'THPT Tân Phú', 'THPT Trần Phú',
  ],
  'Bình Chánh': [
    'CĐ Nghề TP.HCM', 'ĐH Nông Lâm (BC)',
    'THPT Lê Minh Xuân', 'THPT Bình Chánh',
  ],
  'Hóc Môn': [
    'CĐ Nghề Hóc Môn',
    'THPT Hóc Môn', 'THPT Trung Phú (HM)',
  ],
  'Củ Chi': [
    'ĐH Nông Lâm (CC)',
    'THPT Củ Chi', 'THPT Tân Thông Hội',
  ],
  'Nhà Bè': [
    'THPT Nhà Bè', 'CĐ Nghề Nhà Bè',
  ],
  'Cần Giờ': [
    'THPT Cần Giờ',
  ],
};

export const SOURCE_LABELS: Record<string, string> = {
  nhatot: 'Nhatot.com',
  phongtro123: 'PhongTro123',
  batdongsan: 'BatDongSan',
};

export const SOURCE_COLORS: Record<string, string> = {
  nhatot: 'bg-orange-100 text-orange-700',
  phongtro123: 'bg-green-100 text-green-700',
  batdongsan: 'bg-purple-100 text-purple-700',
};
