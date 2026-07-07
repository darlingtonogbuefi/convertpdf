#  backend\utils\blob_storage.py


import os
import logging
from urllib.parse import unquote

from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient

logger = logging.getLogger(__name__)

ACCOUNT_NAME = os.environ["STORAGE_ACCOUNT_NAME"]

credential = DefaultAzureCredential()

blob_service = BlobServiceClient(
    account_url=f"https://{ACCOUNT_NAME}.blob.core.windows.net",
    credential=credential,
)


def upload_bytes(
    container: str,
    blob_name: str,
    data: bytes,
):
    """
    Upload raw bytes to Azure Blob Storage.
    """

    # normalize blob name (prevents accidental % encoding storage)
    blob_name = unquote(blob_name)

    client = blob_service.get_blob_client(
        container=container,
        blob=blob_name,
    )

    client.upload_blob(
        data,
        overwrite=True,
    )

    return blob_name


def upload_file(
    container: str,
    blob_name: str,
    file_path: str,
):
    """
    Upload a local file to Azure Blob Storage.
    """

    # normalize blob name
    blob_name = unquote(blob_name)

    client = blob_service.get_blob_client(
        container=container,
        blob=blob_name,
    )

    with open(file_path, "rb") as f:
        client.upload_blob(
            f,
            overwrite=True,
        )

    return blob_name


def blob_exists(
    container: str,
    blob_name: str,
):
    blob_name = unquote(blob_name)

    client = blob_service.get_blob_client(
        container=container,
        blob=blob_name,
    )

    return client.exists()


def download_blob_bytes(
    container: str,
    blob_name: str,
) -> bytes:
    """
    Download a blob from Azure Storage and return its raw bytes.
    """

    # ensure decoded blob path
    blob_name = unquote(blob_name)

    client = blob_service.get_blob_client(
        container=container,
        blob=blob_name,
    )

    try:
        print("DEBUG DOWNLOAD:", container, blob_name)  # optional debug log

        downloader = client.download_blob()
        return downloader.readall()

    except Exception as e:
        logger.error(f"Blob download failed: {container}/{blob_name} - {e}")
        raise