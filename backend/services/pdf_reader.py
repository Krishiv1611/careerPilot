from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
class PDFReader:
    def __init__(self, chunk_size: int=2000,chunk_overlap: int=200):
        """
        PDF Reader service using LangChain loaders and text splitters.

        :param chunk_size: Size of each text chunk.
        :param chunk_overlap: Overlap between chunks.
        """
        self.text_splitter=RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
    def extract_text(self,file_path:str)->str:
        """
        Extract full raw text from a PDF file.

        :param file_path: Local path to the PDF
        :return: Full extracted text as a single string
        """
        try:
            loader=PyPDFLoader(file_path)
            pages=loader.load()
            full_text="\n".join([page.page_content for page in pages])
            return full_text
        except Exception as e:
            raise RuntimeError(f"Error extracting PDF text: {e}")
    def extract_chunks(self, file_path: str) -> List[str]:
        """
        Extract PDF content into LangChain-compatible text chunks.

        :param file_path: Local path to PDF
        :return: List of text chunks
        """
        try:
            loader = PyPDFLoader(file_path)
            pages = loader.load()

            chunks = self.text_splitter.split_documents(pages)
            return [chunk.page_content for chunk in chunks]

        except Exception as e:
            raise RuntimeError(f"Error chunking PDF: {e}")