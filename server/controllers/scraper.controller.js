export const getScraperStatus = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "Scraper endpoint placeholder" },
  });
};
