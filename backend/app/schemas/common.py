from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Поля в Python — snake_case, в JSON — camelCase, как в frontend/lib/types.ts."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
