import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '', project_id: '', month: '', rate: 100
  });

  const [selectableMonths, setSelectableMonths] = useState([]);

  // 表示期間管理用ステート
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [displayMonths, setDisplayMonths] = useState([]);

  const fetchData = () => {
    axios.get(`${API_URL}/members`).then(res => setMembers(res.data));

    // プロジェクト取得後に期間計算を行うように修正
    axios.get(`${API_URL}/projects`).then(res => {
        setProjects(res.data);
        calculateInitialRange(res.data); // プロジェクトデータを渡して期間計算
    });

    axios.get(`${API_URL}/assignments`).then(res => setAssignments(res.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: Date -> "YYYY-MM"
  const formatMonth = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  // ★修正: 完了していないプロジェクトの全期間をカバーするように初期範囲を計算
  const calculateInitialRange = (projectsData) => {
    // 完了以外のプロジェクトを抽出
    const activeProjects = projectsData.filter(p => p.status !== '完了');

    if (activeProjects.length === 0) {
        // アクティブな案件がない場合は「今月〜半年後」をデフォルトに
        const now = new Date();
        const start = formatMonth(now);
        now.setMonth(now.getMonth() + 5);
        const end = formatMonth(now);
        setFilterStart(start);
        setFilterEnd(end);
        return;
    }

    let globalMin = null;
    let globalMax = null;

    activeProjects.forEach(p => {
        if (!p.period) return;
        // period文字列 "2023/10 - 2024/03" を解析
        const parts = p.period.split(' - ');
        if (parts.length !== 2) return;

        const start = parts[0].replace('/', '-'); // "2023-10"
        const end = parts[1].replace('/', '-');   // "2024-03"

        // 文字列比較で最小・最大を更新 (YYYY-MM形式なら文字列比較でOK)
        if (!globalMin || start < globalMin) globalMin = start;
        if (!globalMax || end > globalMax) globalMax = end;
    });

    // 期間が見つからなかった場合のフォールバック
    if (!globalMin || !globalMax) {
        const now = new Date();
        globalMin = formatMonth(now);
        now.setMonth(now.getMonth() + 5);
        globalMax = formatMonth(now);
    }

    setFilterStart(globalMin);
    setFilterEnd(globalMax);
  };

  // 表示期間配列の生成 (変更なし)
  useEffect(() => {
    if (!filterStart || !filterEnd) return;

    const start = new Date(filterStart + '-01');
    const end = new Date(filterEnd + '-01');

    if (start > end) return;

    const list = [];
    let current = new Date(start);

    while (current <= end) {
        list.push(formatMonth(current));
        current.setMonth(current.getMonth() + 1);
    }
    setDisplayMonths(list);

  }, [filterStart, filterEnd]);


  // --- Helper Functions (変更なし) ---
  const parsePeriodToMonths = (periodStr) => {
    if (!periodStr) return displayMonths;
    try {
      const [startStr, endStr] = periodStr.split(' - ');
      if (!startStr || !endStr) return displayMonths;
      const startDate = new Date(startStr.replace('/', '-'));
      const endDate = new Date(endStr.replace('/', '-'));
      const months = [];
      let current = new Date(startDate);
      while (current <= endDate) {
        months.push(formatMonth(current));
        current.setMonth(current.getMonth() + 1);
      }
      return months;
    } catch (e) {
      return displayMonths;
    }
  };

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setFormData(prev => ({ ...prev, project_id: projectId }));

    if (project) {
        const months = parsePeriodToMonths(project.period);
        setSelectableMonths(months);
        if (!months.includes(formData.month)) {
            setFormData(prev => ({ ...prev, project_id: projectId, month: months[0] || '' }));
        }
    } else {
        setSelectableMonths(displayMonths);
    }
  };

  const getAssign = (memberId, month) => {
    const targetAssigns = assignments.filter(a => a.member_id === memberId && a.month === month);
    if (targetAssigns.length === 0) return { rate: 0, count: 0, names: [] };
    const totalRate = targetAssigns.reduce((sum, a) => sum + a.rate, 0);
    const projectNames = targetAssigns.map(a => a.project_name);
    return { rate: totalRate, count: targetAssigns.length, names: projectNames };
  };

  const getCellColor = (rate) => {
    if (rate === 0) return '#ffebee';
    if (rate < 100) return '#e8f5e9';
    if (rate === 100) return '#c8e6c9';
    if (rate > 100) return '#ffccbc';
    return '#fff';
  };

  const handleCellClick = (memberId, month) => {
    setFormData({
      member_id: memberId,
      project_id: '',
      month: month,
      rate: 100
    });
    setSelectableMonths(displayMonths);
    setOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData({
      member_id: members.length > 0 ? members[0].id : '',
      project_id: '',
      month: displayMonths.length > 0 ? displayMonths[0] : formatMonth(new Date()),
      rate: 100
    });
    setSelectableMonths(displayMonths);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.project_id || !formData.month) {
        alert("案件と月を選択してください");
        return;
    }
    try {
      await axios.post(`${API_URL}/assignments`, formData);
      setOpen(false);
      // 再取得時には期間をリセットしないようにするため fetchData は呼ばず assignments だけ更新でも良いが
      // 簡易的に fetchData を呼ぶ (期間が再計算されるが、プロジェクトデータが変わらなければ同じ期間になるため問題なし)
      fetchData();
    } catch (err) {
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async () => {
    if(!window.confirm("このアサインを解除しますか？")) return;
    try {
        await axios.delete(`${API_URL}/assignments`, {
            params: { member_id: formData.member_id, project_id: formData.project_id, month: formData.month }
        });
        setOpen(false);
        fetchData();
    } catch(err) { alert("削除失敗"); }
  };

  const activeProjects = projects.filter(p => p.status !== '完了');

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} alignItems="center">
        <Typography variant="h4">アサイン管理 (稼働表)</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          アサイン登録
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f8f9fa' }}>
        <FilterAltIcon color="action" />
        <Typography variant="subtitle2">表示期間:</Typography>
        <TextField
            label="開始月" type="month" size="small"
            value={filterStart} onChange={e => setFilterStart(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 180 }}
        />
        <Typography>〜</Typography>
        <TextField
            label="終了月" type="month" size="small"
            value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 180 }}
        />
      </Paper>

      <Paper sx={{ overflowX: 'auto', maxHeight: '70vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150, zIndex: 10, bgcolor: '#f5f5f5' }}>氏名</TableCell>
              {displayMonths.map(m => (
                  <TableCell key={m} align="center" sx={{ fontWeight: 'bold', minWidth: 80, bgcolor: '#f5f5f5' }}>
                      {m}
                  </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map(member => (
              <TableRow key={member.id} hover>
                <TableCell sx={{ bgcolor: '#fff', position: 'sticky', left: 0, borderRight: '1px solid #ddd' }}>
                    <Typography variant="body2" fontWeight="bold">{member.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{member.role}</Typography>
                </TableCell>
                {displayMonths.map(month => {
                  const { rate, names } = getAssign(member.id, month);
                  return (
                    <TableCell
                      key={month}
                      align="center"
                      sx={{ bgcolor: getCellColor(rate), cursor: 'pointer', border: '1px solid #eee' }}
                      onClick={() => handleCellClick(member.id, month)}
                      title={names.join(', ')}
                    >
                      <Typography variant="body2" fontWeight={rate > 0 ? 'bold' : 'normal'}>
                        {rate > 0 ? `${rate}%` : '-'}
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>アサイン登録</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

            <TextField
              select label="対象メンバー" value={formData.member_id}
              onChange={(e) => setFormData({...formData, member_id: e.target.value})}
            >
              {members.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
            </TextField>

            <TextField
              select label="アサイン先案件 (進行中のみ)" value={formData.project_id}
              onChange={(e) => handleProjectChange(e.target.value)}
              helperText="※完了済みの案件は表示されません"
            >
              {activeProjects.length === 0 && <MenuItem disabled>進行中の案件がありません</MenuItem>}
              {activeProjects.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name} ({p.period})</MenuItem>
              ))}
            </TextField>

            <TextField
              select label="対象月" value={formData.month}
              onChange={(e) => setFormData({...formData, month: e.target.value})}
              disabled={!formData.project_id}
            >
              {selectableMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>

            <TextField
              label="稼働率 (%)" type="number" value={formData.rate}
              onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})}
              InputProps={{ inputProps: { min: 0, max: 200 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDelete} color="error" disabled={!formData.project_id}>解除</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}