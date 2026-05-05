import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger("apps")


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default handler to produce a consistent error envelope:

        {
            "status": "error",
            "message": "...",
            "errors": {...}   # optional field-level errors
        }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "status": "error",
            "message": _extract_message(response.data),
        }
        if isinstance(response.data, dict) and len(response.data) > 1:
            error_data["errors"] = response.data

        response.data = error_data
    else:
        # Unhandled server error
        logger.exception("Unhandled exception", exc_info=exc)
        response = Response(
            {"status": "error", "message": "Internal server error."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _extract_message(data):
    if isinstance(data, dict):
        for key in ("detail", "non_field_errors"):
            if key in data:
                val = data[key]
                return str(val[0]) if isinstance(val, list) else str(val)
        # Grab the first field error
        first_key = next(iter(data))
        val = data[first_key]
        msg = str(val[0]) if isinstance(val, list) else str(val)
        return f"{first_key}: {msg}"
    if isinstance(data, list):
        return str(data[0])
    return str(data)
