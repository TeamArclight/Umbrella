"""Umbrella Institutional Audit Trail Logger.

Maintains an auditable, append-only chronological log of all lifecycle events:
- Recommendation generated
- Financing application created
- Human credit officer decision recorded
- Loan disbursement marked
- Resilience asset registered
- Field verification submitted
- Automated evidence checks evaluated
- Supervisory verification confirmed/overridden
- Impact estimation generated
"""

import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from umbrella.schemas.resilience import AuditEvent, AuditActorType


class AuditTrailLogger:
    """Thread-safe append-only audit event repository."""

    def __init__(self):
        self._events: List[AuditEvent] = []
        self._lock = threading.Lock()

    def record_event(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        actor_type: AuditActorType,
        actor_id: str,
        actor_name: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """Append an auditable event to the chronological log."""
        event = AuditEvent(
            event_id=f"AUD-{uuid.uuid4().hex[:10].upper()}",
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor_type=actor_type,
            actor_id=actor_id,
            actor_name=actor_name,
            timestamp=datetime.now(timezone.utc),
            metadata=metadata or {},
        )
        with self._lock:
            self._events.append(event)
        return event

    def list_events(
        self,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        limit: int = 100,
    ) -> List[AuditEvent]:
        """Retrieve events filtered by entity ID and/or entity type, sorted newest first."""
        with self._lock:
            filtered = self._events[:]

        if entity_id:
            filtered = [e for e in filtered if e.entity_id == entity_id]
        if entity_type:
            filtered = [e for e in filtered if e.entity_type == entity_type]

        # Return newest first
        filtered.sort(key=lambda e: e.timestamp, reverse=True)
        return filtered[:limit]

    def clear(self):
        """Reset event log (used in testing and demo resets)."""
        with self._lock:
            self._events.clear()
