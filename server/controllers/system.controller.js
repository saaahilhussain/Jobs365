export const getSystemInfo = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "System endpoint placeholder" },
  });
};
