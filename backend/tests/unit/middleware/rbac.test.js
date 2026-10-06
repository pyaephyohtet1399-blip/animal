const { requireRole, ROLE_PERMISSIONS } = require('../../../src/middleware/rbac');

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('requireRole', () => {
  test('village can create surveys', () => {
    const next = jest.fn();
    requireRole('survey:create')({ user: { role: 'village' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('village can submit surveys', () => {
    const next = jest.fn();
    requireRole('survey:submit')({ user: { role: 'village' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('township can view township reports', () => {
    const next = jest.fn();
    requireRole('report:view_township')({ user: { role: 'township' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('district can reset passwords and view district reports', () => {
    const next = jest.fn();
    requireRole('admin:reset_password')({ user: { role: 'district' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    const next2 = jest.fn();
    requireRole('report:view_district')({ user: { role: 'district' } }, mockRes(), next2);
    expect(next2).toHaveBeenCalledWith();
  });

  test('missing user is rejected', () => {
    const next = jest.fn();
    requireRole('survey:create')({}, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  test('unknown role is rejected', () => {
    const next = jest.fn();
    requireRole('survey:create')({ user: { role: 'admin' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  test('permission map matches spec', () => {
    expect(ROLE_PERMISSIONS.village).toEqual(
      expect.arrayContaining(['survey:create', 'survey:submit'])
    );
    expect(ROLE_PERMISSIONS.township).toContain('report:view_township');
    expect(ROLE_PERMISSIONS.district).toEqual(
      expect.arrayContaining(['survey:delete', 'admin:reset_password', 'report:view_district'])
    );
  });
});
