import os
import re

replacements = {
    r'text-zinc-100': 'text-text-main',
    r'text-zinc-200': 'text-text-main',
    r'text-zinc-300': 'text-text-main',
    r'text-zinc-400': 'text-text-muted',
    r'text-zinc-500': 'text-text-muted',
    r'text-zinc-600': 'text-text-muted',
    r'bg-zinc-900/80': 'bg-bg-card',
    r'bg-zinc-950/50': 'bg-bg-card',
    r'bg-\[\#070708\]/90': 'bg-bg-base/90',
    r'border-zinc-800/80': 'border-border-subtle',
    r'border-zinc-800/90': 'border-border-subtle',
    r'border-zinc-800': 'border-border-subtle',
    r'html-light:[a-zA-Z0-9\-\/]+': '',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in replacements.items():
        new_content = re.sub(pattern, repl, new_content)
        
    new_content = re.sub(r'className="([^"]+)"', lambda m: 'className="' + ' '.join(m.group(1).split()) + '"', new_content)
        
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

for root, _, files in os.walk('frontend/src'):
    for f in files:
        if f.endswith('.tsx'):
            process_file(os.path.join(root, f))
