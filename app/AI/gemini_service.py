import requests
import json
from typing import List, Dict
from app.models import ChatMessage, ChatResponse

class GeminiService:
    def __init__(self):
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def get_chat_response(
        self,
        messages: List[ChatMessage],
        api_key: str,
        model: str = "gemini-1.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> ChatResponse:
        try:
            endpoint = f"{self.base_url}/{model}:generateContent"
            url = f"{endpoint}?key={api_key}"
            
            gemini_messages = [{
                "role": "user" if msg.role == "user" else "model",
                "parts": [{"text": msg.content}]
            } for msg in messages]

            payload = {
                "contents": gemini_messages,
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens
                }
            }

            headers = {"Content-Type": "application/json"}
            response = requests.post(url, headers=headers, json=payload)
            response_data = response.json()

            if response.status_code == 200:
                if "candidates" in response_data and response_data["candidates"]:
                    content = response_data["candidates"][0].get("content", {})
                    if "parts" in content and content["parts"]:
                        reply = content["parts"][0].get("text", "")
                        return ChatResponse(
                            message=ChatMessage(role="model", content=reply),
                            status_code=response.status_code,
                            success=True,
                            raw_response=response_data
                        )

            return ChatResponse(
                message=ChatMessage(role="system", content="Failed to get response from Gemini"),
                status_code=response.status_code,
                success=False,
                raw_response=response_data
            )

        except requests.exceptions.RequestException as e:
            return ChatResponse(
                message=ChatMessage(role="system", content=f"Request Error: {str(e)}"),
                status_code=500,
                success=False
            )
        except json.JSONDecodeError:
            return ChatResponse(
                message=ChatMessage(role="system", content="Invalid JSON response from Gemini"),
                status_code=500,
                success=False
            )
        except Exception as e:
            return ChatResponse(
                message=ChatMessage(role="system", content=f"Unexpected Error: {str(e)}"),
                status_code=500,
                success=False
            )