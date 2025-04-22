# Unlearned Sensors Assistant Backend

## Dependency Issues

If you encounter this error:
```
ModuleNotFoundError: No module named 'pydantic._internal._signature'
```

This is typically caused by a mismatch between pydantic and pydantic-settings versions. To fix it:

1. Upgrade pydantic and pydantic-settings:
```bash
pip install --upgrade pydantic>=2.4.0 pydantic-settings>=2.0.0
```

2. If issues persist, try reinstalling with specific versions:
```bash
pip uninstall -y pydantic pydantic-settings
pip install pydantic==2.4.2 pydantic-settings==2.0.3
```

## API Endpoints

### Sensor Management
- `GET /api/sensors` - Get all sensors
- `GET /api/sensors/{model}` - Get sensor details by model

### Chat Interface
- `POST /api/chat` - Send message to assistant
- `POST /api/sensor/confirm` - Confirm sensor selection
- `POST /api/pdf/upload` - Upload sensor datasheet
- `POST /api/reset` - Reset conversation
- `GET /api/debug/state` - Get current conversation state
