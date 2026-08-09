from pypdf import PdfReader


class PDFReader:
    def extract_text(self, file_path):
        try:
            reader = PdfReader(file_path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as error:
            raise RuntimeError(f"Error extracting PDF text: {error}") from error

    def extract_chunks(self, file_path, chunk_size=2000):
        text = self.extract_text(file_path)
        return [text[index:index + chunk_size] for index in range(0, len(text), chunk_size)]
