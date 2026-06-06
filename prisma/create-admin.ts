/**
 * Creates the admin user in Supabase Auth.
 * Run once: npx tsx --env-file=.env prisma/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_DEFAULT_PASSWORD!;

  console.log(`Creating admin user: ${email}`);

  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find(u => u.email === email);

  if (found) {
    console.log('Admin user already exists, updating metadata...');
    const { error } = await supabase.auth.admin.updateUserById(found.id, {
      user_metadata: { username: 'Admin Kult', role: 'admin' },
    });
    if (error) {
      console.error('Failed to update:', error.message);
      process.exit(1);
    }
    console.log('✓ Admin metadata updated (role: admin)');
    return;
  }

  // Create new admin user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: 'Admin Kult',
      role: 'admin',
    },
  });

  if (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }

  console.log(`✓ Admin user created: ${data.user.id}`);
}

main();
