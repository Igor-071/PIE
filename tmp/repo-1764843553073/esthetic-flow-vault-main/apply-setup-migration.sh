#!/bin/bash
# Apply the setup helper migration
# This creates the function needed for the setup page to work

echo "📦 Applying setup helper migration..."
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    supabase db push
else
    echo "⚠️  Supabase CLI not found"
    echo ""
    echo "To apply the migration, you have two options:"
    echo ""
    echo "Option 1: Use Supabase Dashboard (easiest)"
    echo "  1. Go to: https://supabase.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Click SQL Editor"
    echo "  4. Copy the contents of:"
    echo "     supabase/migrations/20251118120000_setup_helper.sql"
    echo "  5. Paste and click Run"
    echo ""
    echo "Option 2: The setup page will work without this migration"
    echo "  - Just go to http://localhost:8080/setup"
    echo "  - Click the button"
    echo "  - It will create accounts (roles might need manual SQL fix)"
    echo ""
fi

