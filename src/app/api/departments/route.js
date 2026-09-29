import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authService } from '@/services/AuthService';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    await authService.verifySession(token);

    // 1. Fetch departments from Firestore
    const deptSnapshot = await adminDb.collection('departments').get();
    let departments = [];

    if (!deptSnapshot.empty) {
      departments = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 2. Fetch all faculty/signatory users to enrich advisors and leadership
    const usersSnapshot = await adminDb.collection('users').get();
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const signatories = allUsers
      .filter(u => u.role === 'SIGNATORY' || u.role === 'SUPER_ADMIN')
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        designation: u.designation || (u.role === 'SIGNATORY' ? 'Signatory' : 'Administrator'),
        departmentId: u.departmentId || null,
        section: u.section || null,
        school: u.school || 'School of Computing'
      }));

    // Group leadership
    const universityLeadership = {
      institution: 'SRM Institute of Science and Technology (KTR Campus)',
      schools: [
        {
          id: 'SOC',
          name: 'School of Computing',
          dean: signatories.find(s => s.designation?.includes('Dean') || s.email?.startsWith('dean')),
          chairperson: signatories.find(s => s.designation?.includes('Chairperson') && !s.designation?.includes('Associate') || s.email?.startsWith('chairperson')),
          associateChairperson: signatories.find(s => s.designation?.includes('Associate Chairperson') || s.email?.startsWith('assoc.chairperson')),
          departments: departments.length > 0 ? departments : [
            {
              id: 'CTech',
              code: 'CTECH',
              name: 'Computing Technologies',
              hodEmail: 'hod.ctech@srmist.edu.in',
              sections: ['Section A', 'Section B', 'Section C', 'Section D'],
              totalSections: 45
            },
            {
              id: 'CIntel',
              code: 'CINTEL',
              name: 'Computational Intelligence',
              hodEmail: 'hod.cintel@srmist.edu.in',
              sections: ['Section A', 'Section B', 'Section C'],
              totalSections: 40
            },
            {
              id: 'NWC',
              code: 'NWC',
              name: 'Networking and Communications',
              hodEmail: 'hod.nwc@srmist.edu.in',
              sections: ['Section A', 'Section B'],
              totalSections: 35
            },
            {
              id: 'DSBS',
              code: 'DSBS',
              name: 'Data Science and Business Systems',
              hodEmail: 'hod.dsbs@srmist.edu.in',
              sections: ['Section A', 'Section B'],
              totalSections: 35
            }
          ]
        }
      ]
    };

    return NextResponse.json({
      success: true,
      structure: universityLeadership,
      signatories
    });
  } catch (error) {
    console.error('Departments API Error:', error);
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
