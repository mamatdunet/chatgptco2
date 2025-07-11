import json

# Load the JSON file
file_path = 'conversations.json'
with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Initialize counters for total messages and words
total_messages = 0
total_words = 0

# Iterate over each conversation in the data
for conversation in data:
    # Access the mapping which contains the messages
    mapping = conversation.get('mapping', {})

    # Iterate over each message in the mapping
    for message_data in mapping.values():
        message = message_data.get('message')
        if message:
            # Check if the message is from ChatGPT (role is 'assistant')
            author_role = message.get('author', {}).get('role')
            if author_role == 'assistant':
                # Count the message
                total_messages += 1

                # Extract the content and count the words
                content = message.get('content', {})
                if content.get('content_type') == 'text':
                    text_parts = content.get('parts', [])
                    for part in text_parts:
                        if isinstance(part, str):
                            total_words += len(part.split())

# Display the results
print(f"Nombre de messages de l'assistant : {total_messages}")
print(f"Nombre total de mots générés : {total_words}")
