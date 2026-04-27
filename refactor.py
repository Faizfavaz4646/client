import sys

with open('./src/components/chat/ChatRoom.tsx', 'r') as f:
    lines = f.readlines()

# Find start of map block
start_idx = -1
for i, line in enumerate(lines):
    if ".map((msg, i) => {" in line:
        start_idx = i
        break

# Find end of map block
end_idx = -1
for i in range(start_idx, len(lines)):
    if "          })" in line and "        )" in lines[i+1]:
        end_idx = i
        break
    
if start_idx == -1 or end_idx == -1:
    print("Could not find start or end index.")
    sys.exit(1)

body = "".join(lines[start_idx+1:end_idx])

# We need to build the completely new JSX layout
# We insert renderMessageBubble right before return ( at line 255
return_idx = -1
for i, line in enumerate(lines):
    if "  return (" in line:
        return_idx = i
        break

prefix = "".join(lines[:return_idx])

render_func = f"""  const validMessages = messages
    .filter(msg => !hiddenMessageIds.includes(String(msg._id || msg.id)))
    .filter(msg => !msg.content?.startsWith("@@SYSTEM_CALL_TYPE:"));

  const pinnedMessages = validMessages.filter(m => m.isPinned).sort((a,b) => new Date(a.pinnedAt || 0).getTime() - new Date(b.pinnedAt || 0).getTime());
  const regularMessages = validMessages.filter(m => !m.isPinned).sort((a,b) => new Date(a.createdAt || a.timestamp || 0).getTime() - new Date(b.createdAt || b.timestamp || 0).getTime());

  const renderMessageBubble = (msg: Message, i: number) => {{
{body}  }};

"""

middle = "".join(lines[return_idx:start_idx-8]) # up to messages...

new_jsx = """
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 max-w-lg mx-auto pb-20">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
              <Hash className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome to #{channel?.name || 'general'}!</h1>
            <p className="text-slate-400 text-center">This is the start of the #{channel?.name || 'general'} channel. Start a conversation or share your media.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full relative">
            {/* STICKY PINNED HEADER */}
            {pinnedMessages.length > 0 && (
              <div className="sticky top-0 z-[60] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-amber-500/20 pb-4 pt-1 shadow-2xl max-h-[35vh] overflow-y-auto custom-scrollbar rounded-b-2xl mb-4">
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#0a0a0a]/95 z-[70] py-2 px-4 shadow-sm border-b border-white/5">
                  <div className="p-1.5 bg-amber-500/20 rounded-md"><Pin className="w-4 h-4 text-amber-500" /></div>
                  <span className="text-xs font-bold text-amber-500 tracking-widest uppercase">Pinned Messages</span>
                  <div className="flex-1 h-px bg-white/5 ml-2" />
                </div>
                <div className="px-2">
                  {pinnedMessages.map((msg, i) => renderMessageBubble(msg, i))}
                </div>
              </div>
            )}
            
            <div className="flex-1">
              {regularMessages.map((msg, i) => renderMessageBubble(msg, i))}
            </div>
          </div>
        )}
"""

suffix = "".join(lines[end_idx+2:])

with open('./src/components/chat/ChatRoom.tsx', 'w') as f:
    f.write(prefix + render_func + middle + new_jsx + suffix)
    
print("Refactored successfully")
