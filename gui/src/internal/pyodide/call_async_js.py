import asyncio

_SP_CALL_ASYNC_FUNCTION = None

def _set_sp_call_async_function(func):
    global _SP_CALL_ASYNC_FUNCTION
    _SP_CALL_ASYNC_FUNCTION = func

def call_async_js(name, *args):
    return asyncio.get_event_loop().run_until_complete(_SP_CALL_ASYNC_FUNCTION(name, *args))  # type: ignore # noqa E501
