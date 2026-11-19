from fastapi import APIRouter, HTTPException

from ..models import (
    ConversationListItem,
    ConversationOut,
    FeedbackRequest,
    MessageOut,
    PatchConversationRequest,
    PostMessageRequest,
    SendMessageResponse,
)
from ..services import conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationListItem])
def list_conversations():
    return conversation_service.list_conversations()


@router.post("", response_model=ConversationOut, status_code=201)
def create_conversation():
    return conversation_service.create_conversation()


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: str):
    conv = conversation_service.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.patch("/{conversation_id}", response_model=ConversationOut)
def rename_conversation(conversation_id: str, body: PatchConversationRequest):
    if body.title is None:
        raise HTTPException(status_code=400, detail="title is required")
    conv = conversation_service.rename_conversation(conversation_id, body.title)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: str):
    if not conversation_service.delete_conversation(conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.post("/{conversation_id}/messages", response_model=SendMessageResponse)
def send_message(conversation_id: str, body: PostMessageRequest):
    res = conversation_service.send_message(conversation_id, body.content, body.mode)
    if res is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return res


@router.post("/messages/{message_id}/feedback", response_model=MessageOut)
def message_feedback(message_id: str, body: FeedbackRequest):
    msg = conversation_service.set_message_feedback(message_id, body.feedback)
    if msg is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


# Unprefixed alias matching API_CONTRACT.md: POST /api/messages/{id}/feedback
feedback_router = APIRouter(tags=["conversations"])


@feedback_router.post("/messages/{message_id}/feedback", response_model=MessageOut)
def message_feedback_alias(message_id: str, body: FeedbackRequest):
    return message_feedback(message_id, body)
