import streamlit as st
from app.AI.gemini_service import GeminiService
from app.models import ChatMessage
import asyncio

if "messages" not in st.session_state:
    st.session_state.messages = []

def main():
    st.title("Gemini API Tester")
    gemini_service = GeminiService()

    # Sidebar configuration
    with st.sidebar:
        st.header("API Configuration")
        api_key = st.text_input("Gemini API Key", type="password")
        model = st.selectbox("Model", ["gemini-1.5-flash"], index=0)
        temperature = st.slider("Temperature", 0.0, 2.0, 0.7, 0.1)
        max_tokens = st.number_input("Max Tokens", min_value=1, max_value=4096, value=2048)

    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message.role):
            st.markdown(message.content)

    # Accept user input
    if prompt := st.chat_input("What would you like to ask Gemini?"):
        if not api_key:
            st.error("Please enter your Gemini API key")
            return

        # Add user message to chat history
        user_message = ChatMessage(role="user", content=prompt)
        st.session_state.messages.append(user_message)
        
        with st.chat_message("user"):
            st.markdown(prompt)

        # Display assistant response
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            
            response = asyncio.run(gemini_service.get_chat_response(
                messages=st.session_state.messages,
                api_key=api_key,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            ))

            if response.success:
                st.session_state.messages.append(response.message)
                message_placeholder.markdown(response.message.content)
            else:
                st.error(response.message.content)

if __name__ == "__main__":
    main()